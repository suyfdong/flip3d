export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
