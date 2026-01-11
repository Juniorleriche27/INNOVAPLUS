import ThemeContent from "../ThemeContent";

type Props = { params: { theme: string } };

export default function ThemePage({ params }: Props) {
  return <ThemeContent slug={params.theme} />;
}
