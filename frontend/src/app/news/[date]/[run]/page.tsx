import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamicParams = false;

type NewsReportPageParams = {
  date: string;
  run: string;
};

type NewsReportPageProps = {
  params: Promise<NewsReportPageParams>;
};

export async function generateStaticParams() {
  return [{ date: "0000-00-00", run: "000000" }];
}

export async function generateMetadata({ params }: NewsReportPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: "YouTube news",
    alternates: {
      canonical: "/youtube-news",
    },
    openGraph: {
      url: "https://kospipreview.com/youtube-news",
      type: "article",
      locale: "ko_KR",
      title: "YouTube news",
      siteName: "KOSPI DAWN",
      description: `${resolvedParams.date} / ${resolvedParams.run} is archived`,
    },
  };
}

export default async function YoutubeNewsReportPage({ params }: NewsReportPageProps) {
  await params;
  redirect("/youtube-news");
}
