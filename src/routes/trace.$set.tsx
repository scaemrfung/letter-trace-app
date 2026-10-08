import { createFileRoute, redirect } from "@tanstack/react-router";
import { PracticeScreen } from "@/components/practice-screen";

export const Route = createFileRoute("/trace/$set")({
  beforeLoad: ({ params }) => {
    if (params.set !== "letters" && params.set !== "numbers") {
      throw redirect({ to: "/" });
    }
  },
  component: PracticeRoute,
});

function PracticeRoute() {
  const { set } = Route.useParams();
  if (set !== "letters" && set !== "numbers") return null;
  return <PracticeScreen kind={set} />;
}
