import { Suspense } from "react";
import { getSession as auth } from "@/lib/session";
import { getHiddenWidgets } from "@/lib/widgets";
import Hideable from "@/components/widgets/Hideable";
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
      {!hidden.has("latest_news") && <Hideable widgetKey="latest_news" canHide={isLoggedIn}><Suspense fallback={null}><LatestNews limit={5} /></Suspense></Hideable>}
      {!hidden.has("users_online") && <Hideable widgetKey="users_online" canHide={isLoggedIn}><UsersOnlineLive isLoggedIn={isLoggedIn} currentUserId={currentUserId} /></Hideable>}
      {!hidden.has("ced_sessions") && <Hideable widgetKey="ced_sessions" canHide={isLoggedIn}><CedSessions /></Hideable>}
      {!hidden.has("now_playing") && <Hideable widgetKey="now_playing" canHide={isLoggedIn}><NowPlaying /></Hideable>}
      {!hidden.has("music_player") && <Hideable widgetKey="music_player" canHide={isLoggedIn}><MusicPlayer /></Hideable>}
      {!hidden.has("last_callers") && <Hideable widgetKey="last_callers" canHide={isLoggedIn}><Suspense fallback={null}><LastCallers limit={5} /></Suspense></Hideable>}
      {!hidden.has("poll_latest_closed") && <Hideable widgetKey="poll_latest_closed" canHide={isLoggedIn}><Suspense fallback={null}><PollSidebarLatest /></Suspense></Hideable>}
      {!hidden.has("latest_collys_released") && <Hideable widgetKey="latest_collys_released" canHide={isLoggedIn}><Suspense fallback={null}><LatestCollys type="released" limit={8} /></Suspense></Hideable>}
      {!hidden.has("latest_collys_added") && <Hideable widgetKey="latest_collys_added" canHide={isLoggedIn}><Suspense fallback={null}><LatestCollys type="added" limit={5} /></Suspense></Hideable>}
      {!hidden.has("latest_mags") && <Hideable widgetKey="latest_mags" canHide={isLoggedIn}><Suspense fallback={null}><LatestMags limit={5} /></Suspense></Hideable>}
      {!hidden.has("latest_apps") && <Hideable widgetKey="latest_apps" canHide={isLoggedIn}><Suspense fallback={null}><LatestApps limit={5} /></Suspense></Hideable>}
      {!hidden.has("new_users") && <Hideable widgetKey="new_users" canHide={isLoggedIn}><Suspense fallback={null}><NewUsers /></Suspense></Hideable>}
      {!hidden.has("weektop") && <Hideable widgetKey="weektop" canHide={isLoggedIn}><Suspense fallback={null}><Weektop /></Suspense></Hideable>}
    </>
  );
}
