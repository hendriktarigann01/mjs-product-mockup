import Link from "next/link";

export interface HeaderProps {
  breadcrumb?: string;
  breadcrumbPath?: string;
  title: string;
  rightElement?: React.ReactNode;
}

export function Header({
  breadcrumb,
  breadcrumbPath,
  title,
  rightElement,
}: HeaderProps) {
  return (
    <div className="mb-10">
      {breadcrumb && (
        <p className="font-mono text-xs tracking-[0.3em] text-stone-400 uppercase mb-1">
          {breadcrumbPath ? (
            <Link
              href={breadcrumbPath}
              className="hover:text-stone-600 transition-colors"
            >
              {breadcrumb}
            </Link>
          ) : (
            breadcrumb
          )}
        </p>
      )}
      <div className="flex items-end justify-between">
        <h1 className=" text-4xl md:text-5xl text-stone-800 leading-tight">
          {title}
        </h1>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </div>
  );
}
