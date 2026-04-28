import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomeView from "./views/HomeView";
import LearnView from "./views/LearnView";
import LessonView from "./views/LessonView";
import PracticeView from "./views/PracticeView";
import MockTestView from "./views/MockTestView";
import MockExamView from "./views/MockExamView";
import MockResultView from "./views/MockResultView";
import ReviewView from "./views/ReviewView";
import BookmarksView from "./views/BookmarksView";
import SettingsView from "./views/SettingsView";
import OnboardingView from "./views/OnboardingView";
import SignsView from "./views/SignsView";
import SignRushView from "./views/SignRushView";
import SongsView from "./views/SongsView";
import { useUserData } from "./engine/store";

export default function App() {
  const { data } = useUserData();
  const onboarded = !!data.profile.vehicleClass;

  return (
    <Routes>
      <Route path="/start" element={<OnboardingView />} />

      {!onboarded ? (
        <Route path="*" element={<Navigate to="/start" replace />} />
      ) : (
        <>
          <Route path="/mock/exam" element={<MockExamView />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomeView />} />
            <Route path="/learn" element={<LearnView />} />
            <Route path="/learn/:lessonId" element={<LessonView />} />
            <Route path="/practice" element={<PracticeView />} />
            <Route path="/mock" element={<MockTestView />} />
            <Route path="/mock/result" element={<MockResultView />} />
            <Route path="/signs" element={<SignsView />} />
            <Route path="/signs/rush" element={<SignRushView />} />
            <Route path="/songs" element={<SongsView />} />
            <Route path="/review" element={<ReviewView />} />
            <Route path="/bookmarks" element={<BookmarksView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </>
      )}
    </Routes>
  );
}
