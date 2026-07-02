import { cn } from "@/lib/utils";
import type { Project } from "@/lib/data";

function Cell({
  className,
  children,
  empty,
}: {
  className?: string;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className={cn("block", empty && "line-through opacity-25", className)}>
      {empty ? "—" : children}
    </div>
  );
}

/** Year / With / For / Location metadata table (source: `.data-table`). */
export function DataTable({ project }: { project: Project }) {
  const widths = {
    date: "w-[16.6667%]",
    studio: "w-[33.3333%] pr-4",
    client: "w-[30%] pr-5",
    location: "w-[20%]",
  };

  return (
    <div className="block w-full text-small">
      {/* header row */}
      <div className="mb-1 flex items-start justify-between text-muted">
        <Cell className={widths.date}>
          <h3>Year</h3>
        </Cell>
        <Cell className={widths.studio}>
          <h3>With</h3>
        </Cell>
        <Cell className={widths.client}>
          <h3>For</h3>
        </Cell>
        <Cell className={widths.location}>
          <h3>Location</h3>
        </Cell>
      </div>

      {/* value row */}
      <div className="flex items-start justify-between">
        <Cell className={widths.date} empty={!project.year}>
          {project.year}
        </Cell>
        <Cell className={widths.studio} empty={!project.with?.length}>
          <ul className="block">
            {project.with?.map((c, i, arr) => (
              <li key={c.name} className="inline-block">
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-65"
                  >
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
                {i < arr.length - 1 ? ", " : ""}
              </li>
            ))}
          </ul>
        </Cell>
        <Cell className={widths.client} empty={!project.for}>
          {project.for}
        </Cell>
        <Cell className={widths.location} empty={!project.location}>
          {project.location}
        </Cell>
      </div>
    </div>
  );
}
