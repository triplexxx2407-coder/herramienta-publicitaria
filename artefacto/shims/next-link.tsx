import type { AnchorHTMLAttributes, ReactNode } from "react";
import { hashDe } from "./rutas";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children?: ReactNode };

export default function Link({ href, children, ...resto }: Props) {
  return (
    <a href={hashDe(href)} {...resto}>
      {children}
    </a>
  );
}
