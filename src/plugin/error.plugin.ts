import { ErrorAlert } from "@components/error-alert.tsx";
import { Elysia } from "elysia";
import { ResourceNotFoundError } from "@/shared/errors.ts";
import { HX } from "@/shared/routes.ts";

export const errorPlugin = () =>
	new Elysia({ name: "plugin.error" })
		.error({ RESOURCE_NOT_FOUND: ResourceNotFoundError })
		.onError({ as: "global" }, ({ code, error, request, status }) => {
			const isHtmx = request.headers.has(HX.request);

			if (code === "RESOURCE_NOT_FOUND") {
				return status(404, error.message);
			}

			if (code === "VALIDATION" && isHtmx) {
				return status(
					422,
					ErrorAlert({
						children: "Invalid input. Check the form and try again.",
					}),
				);
			}

			if (code === "UNKNOWN" || code === "INTERNAL_SERVER_ERROR") {
				const message = "Something went wrong. Please try again.";
				return isHtmx
					? status(500, ErrorAlert({ children: message }))
					: status(500, message);
			}
		});
