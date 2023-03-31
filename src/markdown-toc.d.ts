declare module "markdown-toc" {
  interface TocItem {
    content: string;
    slug: string;
    lvl: number;
    children?: TocItem[];
  }

  interface Toc {
    content: string;
    json: TocItem[];
  }

  export default function toc(markdown: string, options?: any): Toc;
}
