import { Suspense } from "react";
import { getSession as auth } from "@/lib/session";
import { getHiddenWidgets } from "@/lib/widgets";
import LatestNews from "@/components/widgets/LatestNews";
import UsersOnlineLive from "@/components/widgets/UsersOnlineLive";
import CedSessions from "@/components/widgets/CedSessions";
import NowPlaying from "@/components/widgets/NowPlaying";
import MusicPlayer from "@/components/widgets/MusicPlayer";
import LastCallers from "@/components/widgets/LastCallers";
import PollSidebarLatest from "@/components/widgets/PollSidebarLatest";
import LatestCollys from "@/components/widgets/LatestCollys";
import LatestMags from "@/components/widgets/LatestMags";
import LatestApps from "@/components/widgets/LatestApps";
import NewUsers from "@/components/widgets/NewUsers";
import Weektop from "@/components/widgets/Weektop";

export default async function LeftSidebar() {
  const session = await auth().catch(() => null);
  const user = (session as { user?: { id?: string } } | null)?.user;
  const isLoggedIn = !!user;
  const currentUserId = user?.id ? parseInt(user.id, 10) : undefined;
  const hidden = await getHiddenWidgets();
  return (
    <>
      {!hidden.has("latest_news") && <Suspense fallback={null}><LatestNews limit={5} /></Suspense>}
      {!hidden.has("users_online") && <UsersOnlineLive isLoggedIn={isLoggedIn} currentUserId={currentUserId} />}
      {!hidden.has("ced_sessions") && <CedSessions />}
      {!hidden.has("now_playing") && <NowPlaying />}
      {!hidden.has("music_player") && <MusicPlayer />}
      {!hidden.has("last_callers") && <Suspense fallback={null}><LastCallers limit={5} /></Suspense>}
      {!hidden.has("poll_latest_closed") && <Suspense fallback={null}><PollSidebarLatest /></Suspense>}
      {!hidden.has("latest_collys_released") && <Suspense fallback={null}><LatestCollys type="released" limit={8} /></Suspense>}
      {!hidden.has("latest_collys_added") && <Suspense fallback={null}><LatestCollys type="added" limit={5} /></Suspense>}
      {!hidden.has("latest_mags") && <Suspense fallback={null}><LatestMags limit={5} /></Suspense>}
      {!hidden.has("latest_apps") && <Suspense fallback={null}><LatestApps limit={5} /></Suspense>}
      {!hidden.has("new_users") && <Suspense fallback={null}><NewUsers /></Suspense>}
      {!hidden.has("weektop") && <Suspense fallback={null}><Weektop /></Suspense>}
    </>
  );
}
