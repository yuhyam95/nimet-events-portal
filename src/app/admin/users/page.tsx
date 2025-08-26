import { UserList } from "@/components/user-list";
import { getUsers } from "@/lib/actions";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions.
        </p>
      </div>
      <UserList users={users} />
    </div>
  );
}
