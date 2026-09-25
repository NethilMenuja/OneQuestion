import { createClient } from "@supabase/supabase-js";
import SharedAnswerClient from "./SharedAnswerClient";

type Answer = {
  id: number;
  question_id: number;
  answer: string;
  name: string;
  country: string;
  created_at: string;
};

type Question = {
  id: number;
  question: string;
};

type Props = {
  params: Promise<{ id: string }>;
};

const countryFlags: Record<string, string> = {
  "Sri Lanka": "lk",
  India: "in",
  "United States": "us",
  "United Kingdom": "gb",
  Australia: "au",
  Canada: "ca",
  Japan: "jp",
  Germany: "de",
  France: "fr",
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const answerId = Number(id);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: answer } = await supabase
    .from("answers")
    .select("id, question_id, answer, name, country")
    .eq("id", answerId)
    .maybeSingle();

  if (!answer) {
    return {
      title: "Answer | ONEQUESTION",
      description: "One question. One answer. One world.",
    };
  }

  const { data: question } = await supabase
    .from("questions")
    .select("question")
    .eq("id", answer.question_id)
    .maybeSingle();

  const description =
    answer.answer.length > 160
      ? `${answer.answer.slice(0, 157)}...`
      : answer.answer;

  return {
    title: `${answer.name}'s answer | ONEQUESTION`,
    description,

    openGraph: {
      title: `${answer.name}'s answer | ONEQUESTION`,
      description,
      type: "website",
      siteName: "ONEQUESTION",
    },

    twitter: {
      card: "summary",
      title: `${answer.name}'s answer | ONEQUESTION`,
      description,
    },
  };
}

export default async function SharedAnswerPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <SharedAnswerClient
      answerId={id}
    />
  );
}