import { BaseHtml, type BaseHtmlProps } from "./base-html.tsx";
import { Navbar, type NavbarProps } from "./navbar.tsx";

type LayoutProps = Omit<BaseHtmlProps, "children"> &
	NavbarProps & { children: JSX.Element };

export const Layout = ({ user, children, ...head }: LayoutProps) => (
	<BaseHtml {...head}>
		<Navbar user={user} />
		{children}
	</BaseHtml>
);
