import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageHeader } from "@/components/layout/page-header";
import { UserProfileForm } from "@/components/user-profile/user-profile-form";
import { authOptions } from "@/lib/auth/options";
import { getUserProfileById } from "@/lib/data/user-profile";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfileById(session.user.id);
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi perfil"
        description="Tus datos personales y de contacto. Solo el nombre es obligatorio; el resto es opcional."
      />
      <UserProfileForm initial={profile} />
    </div>
  );
}
