import projects from "./src/_data/projects.json" with { type: "json" };

/** @type {import("@11ty/eleventy").UserConfig} */
export default async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("media");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });

  eleventyConfig.addCollection("projects", () => {
    return projects
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((project) => ({
        data: project,
        url: `/projects/${project.slug}/`,
      }));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
    },
  };
}
