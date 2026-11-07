{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = {nixpkgs, ...}: let
    systems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
    devShells = nixpkgs.lib.genAttrs systems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        packages = [
          pkgs.mise # JS toolchain versions: .mise.toml, not nix
          pkgs.postgresql_18 # dev db over a unix socket, no daemon or TCP port needed
        ];
        shellHook = ''
          export PG_DATA=$PWD/.postgres/data
          export PG_SOCK=$PWD/.postgres
          export PGUSER=postgres
          export PGHOST=$PG_SOCK
          if [ ! -s "$PG_DATA/PG_VERSION" ]; then
            mkdir -p "$PG_SOCK"
            initdb -D "$PG_DATA" -U postgres --auth=trust --locale=C -E UTF8 >/dev/null
          fi
          if ! pg_isready -q -h "$PG_SOCK"; then
            pg_ctl start -D "$PG_DATA" -w -o "-k $PG_SOCK -c listen_addresses=" >/dev/null
          fi
          if ! psql -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='helysia'" | grep -q 1; then
            createdb -h "$PG_SOCK" -U postgres helysia
          fi
          # libpq-style URL: unix socket dir goes in the host query param, percent-encoded;
          # keep a DATABASE_URL the user brought along (e.g. the docker dev db), else the socket one
          if [ -z "$DATABASE_URL" ]; then
            export DATABASE_URL="postgres://postgres@/helysia?host=''${PG_SOCK//\//%2F}"
          fi
          # stable-per-repo dev secret so sessions survive server restarts
          if [ -z "$JWT_SECRET" ]; then
            if [ ! -s "$PG_SOCK/jwt_secret" ]; then
              head -c 32 /dev/urandom | base64 > "$PG_SOCK/jwt_secret"
            fi
            export JWT_SECRET="$(cat "$PG_SOCK/jwt_secret")"
          fi
        '';
      };
    });
  in {
    inherit devShells;
  };
}
