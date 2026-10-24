// A plain form post, so signing out works without client JavaScript.
export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="rounded-[6px] px-2.5 py-1 text-[13px] text-faint transition-colors hover:text-ink">
        Sign out
      </button>
    </form>
  );
}
