import { auth } from "@/auth";
import { getInviteByToken } from "@/lib/invites";
import InviteAction from "./invite-action";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const { data: invite, error } = await getInviteByToken(params.token);
  const session = await auth();

  return (
    <InviteAction
      invite={invite}
      error={error}
      isLoggedIn={!!session?.user?.id}
      userEmail={session?.user?.email || null}
      token={params.token}
    />
  );
}
