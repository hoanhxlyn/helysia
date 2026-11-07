import { describe, expect, test } from "bun:test";
import { BaseHtml, type BaseHtmlProps } from "@components/base-html.tsx";

const render = (props: Omit<BaseHtmlProps, "children"> = {}) =>
	String(
		<BaseHtml {...props}>
			<main>content</main>
		</BaseHtml>,
	);

describe("BaseHtml", () => {
	test("renders the children inside the body", () => {
		expect(render()).toMatch(/<body[^>]*><main>content<\/main><\/body>/);
	});

	test("uses the default title and sets the language and theme", () => {
		const html = render();
		expect(html).toContain("<title>Helysia</title>");
		expect(html).toContain('lang="en"');
		expect(html).toContain('data-theme="coffee"');
	});

	test("escapes a custom title", () => {
		const html = render({ title: "<script>alert(1)</script>" });
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(html).not.toContain("<script>alert(1)");
	});

	test("renders a string description and keywords as they are", () => {
		const html = render({ description: "A page", meta: "one" });
		expect(html).toContain('name="description" content="A page"');
		expect(html).toContain('name="keywords" content="one"');
	});

	test("joins an array description and keywords with commas", () => {
		const html = render({ description: ["a", "b"], meta: ["x", "y"] });
		expect(html).toContain('name="description" content="a,b"');
		expect(html).toContain('name="keywords" content="x,y"');
	});

	test("omits the content attribute when description and keywords are missing", () => {
		expect(render()).not.toContain("undefined");
	});
});
