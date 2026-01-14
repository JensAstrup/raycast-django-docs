import { render, screen } from "@testing-library/react";
import { DocDetail } from "../DocDetail";
import { DocEntry } from "../../types/DocEntry";

describe("DocDetail", () => {
  const mockEntry: DocEntry = {
    url: "https://docs.djangoproject.com/en/dev/topics/http/",
    title: "HTTP Request Handling",
    content: "This is the content of the HTTP documentation page.",
    parent: null,
    previous: null,
    next: null,
  };

  it("renders the entry title and content as markdown", () => {
    render(<DocDetail entry={mockEntry} />);

    const markdown = screen.getByTestId("detail-markdown");
    expect(markdown).toHaveTextContent("# HTTP Request Handling");
    expect(markdown).toHaveTextContent("This is the content of the HTTP documentation page.");
  });

  it("renders action panel with open browser and copy URL actions", () => {
    render(<DocDetail entry={mockEntry} />);

    const actionPanel = screen.getByTestId("action-panel");
    expect(actionPanel).toBeInTheDocument();

    const openAction = screen.getByTestId("action-open-browser");
    expect(openAction).toBeInTheDocument();
    expect(openAction).toHaveAttribute("data-url", mockEntry.url);

    const copyAction = screen.getByTestId("action-copy");
    expect(copyAction).toBeInTheDocument();
    expect(copyAction).toHaveAttribute("data-content", mockEntry.url);
  });

  it("does not render metadata section when no parent, previous, or next links exist", () => {
    render(<DocDetail entry={mockEntry} />);

    const metadata = screen.queryByTestId("detail-metadata");
    expect(metadata).not.toBeInTheDocument();
  });

  it("renders metadata with parent link when parent exists", () => {
    const entryWithParent: DocEntry = {
      ...mockEntry,
      parent: {
        url: "https://docs.djangoproject.com/en/dev/topics/",
        title: "Topics",
        content: "Topics content",
        parent: null,
        previous: null,
        next: null,
      },
    };

    render(<DocDetail entry={entryWithParent} />);

    const metadata = screen.getByTestId("detail-metadata");
    expect(metadata).toBeInTheDocument();

    const links = screen.getAllByTestId("metadata-link");
    const parentLink = links.find((link) => link.getAttribute("data-title") === "Parent");
    expect(parentLink).toBeDefined();
    expect(parentLink).toHaveAttribute("data-target", entryWithParent.parent!.url);
    expect(parentLink).toHaveTextContent("Topics");
  });

  it("renders metadata with previous link when previous exists", () => {
    const entryWithPrevious: DocEntry = {
      ...mockEntry,
      previous: {
        url: "https://docs.djangoproject.com/en/dev/topics/forms/",
        title: "Forms",
        content: "Forms content",
        parent: null,
        previous: null,
        next: null,
      },
    };

    render(<DocDetail entry={entryWithPrevious} />);

    const metadata = screen.getByTestId("detail-metadata");
    expect(metadata).toBeInTheDocument();

    const links = screen.getAllByTestId("metadata-link");
    const previousLink = links.find((link) => link.getAttribute("data-title") === "Previous");
    expect(previousLink).toBeDefined();
    expect(previousLink).toHaveAttribute("data-target", entryWithPrevious.previous!.url);
    expect(previousLink).toHaveTextContent("Forms");
  });

  it("renders metadata with next link when next exists", () => {
    const entryWithNext: DocEntry = {
      ...mockEntry,
      next: {
        url: "https://docs.djangoproject.com/en/dev/topics/db/",
        title: "Database",
        content: "Database content",
        parent: null,
        previous: null,
        next: null,
      },
    };

    render(<DocDetail entry={entryWithNext} />);

    const metadata = screen.getByTestId("detail-metadata");
    expect(metadata).toBeInTheDocument();

    const links = screen.getAllByTestId("metadata-link");
    const nextLink = links.find((link) => link.getAttribute("data-title") === "Next");
    expect(nextLink).toBeDefined();
    expect(nextLink).toHaveAttribute("data-target", entryWithNext.next!.url);
    expect(nextLink).toHaveTextContent("Database");
  });

  it("renders metadata with all links when parent, previous, and next exist", () => {
    const fullEntry: DocEntry = {
      ...mockEntry,
      parent: {
        url: "https://docs.djangoproject.com/en/dev/topics/",
        title: "Topics",
        content: "Topics content",
        parent: null,
        previous: null,
        next: null,
      },
      previous: {
        url: "https://docs.djangoproject.com/en/dev/topics/forms/",
        title: "Forms",
        content: "Forms content",
        parent: null,
        previous: null,
        next: null,
      },
      next: {
        url: "https://docs.djangoproject.com/en/dev/topics/db/",
        title: "Database",
        content: "Database content",
        parent: null,
        previous: null,
        next: null,
      },
    };

    render(<DocDetail entry={fullEntry} />);

    const metadata = screen.getByTestId("detail-metadata");
    expect(metadata).toBeInTheDocument();

    const links = screen.getAllByTestId("metadata-link");
    expect(links).toHaveLength(3);

    const parentLink = links.find((link) => link.getAttribute("data-title") === "Parent");
    expect(parentLink).toBeDefined();
    expect(parentLink).toHaveAttribute("data-target", fullEntry.parent!.url);

    const previousLink = links.find((link) => link.getAttribute("data-title") === "Previous");
    expect(previousLink).toBeDefined();
    expect(previousLink).toHaveAttribute("data-target", fullEntry.previous!.url);

    const nextLink = links.find((link) => link.getAttribute("data-title") === "Next");
    expect(nextLink).toBeDefined();
    expect(nextLink).toHaveAttribute("data-target", fullEntry.next!.url);
  });

  it("renders correctly with empty content", () => {
    const entryWithEmptyContent: DocEntry = {
      ...mockEntry,
      content: "",
    };

    render(<DocDetail entry={entryWithEmptyContent} />);

    const markdown = screen.getByTestId("detail-markdown");
    expect(markdown).toHaveTextContent("# HTTP Request Handling");
    expect(markdown.textContent).toContain(entryWithEmptyContent.title);
  });

  it("renders with special characters in title and content", () => {
    const entryWithSpecialChars: DocEntry = {
      ...mockEntry,
      title: "HTTP & HTTPS: <Request> Handling",
      content: "Content with special chars: <, >, &, \", '",
    };

    render(<DocDetail entry={entryWithSpecialChars} />);

    const markdown = screen.getByTestId("detail-markdown");
    expect(markdown).toHaveTextContent(entryWithSpecialChars.title);
    expect(markdown).toHaveTextContent(entryWithSpecialChars.content);
  });
});
