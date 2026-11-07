export type BaseHtmlProps = {
	children: JSX.Element | JSX.Element[];
	title?: string;
	description?: string | string[];
	meta?: string | string[];
};

export const BaseHtml = (props: BaseHtmlProps) => {
	return (
		<html lang="en" data-theme="coffee">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta
					name="htmx-config"
					content='{"responseHandling":[{"code":".*","swap":true}]}'
				/>
				<script src="/static/scripts/htmx.min.js" />
				<link href="/static/global.css" rel="stylesheet" type="text/css" />
				<title safe>{props.title ?? "Helysia"}</title>
				{props.description && Array.isArray(props.description) ? (
					<meta safe name="description" content={props.description.join(",")} />
				) : (
					<meta safe name="description" content={props.description} />
				)}
				{props.meta && Array.isArray(props.meta) ? (
					<meta safe name="keywords" content={props.meta.join(",")} />
				) : (
					<meta safe name="keywords" content={props.meta} />
				)}
			</head>
			<body class="min-h-screen flex flex-col bg-base-200">
				{props.children}
			</body>
		</html>
	);
};
