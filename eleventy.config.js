/** @type {import("@11ty/eleventy").UserConfig} */
export default async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("media");
  eleventyConfig.addPassthroughCopy("js");

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
