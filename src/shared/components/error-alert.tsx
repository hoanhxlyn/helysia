export const ErrorAlert = ({ children }: { children: JSX.Element }) => (
	<div role="alert" class="alert alert-error">
		<span>{children}</span>
	</div>
);
