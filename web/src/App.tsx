import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomeView from "./views/HomeView";
import PracticeView from "./views/PracticeView";
import MockTestView from "./views/MockTestView";
import MockExamView from "./views/MockExamView";
import MockResultView from "./views/MockResultView";
import ReviewView from "./views/ReviewView";
import BookmarksView from "./views/BookmarksView";
import SettingsView from "./views/SettingsView";

export default function App() {
  return (
    <Routes>
      {/* Mock exam runs full-bleed without the layout chrome */}
      <Route path="/mock/exam" element={<MockExamView />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomeView />} />
        <Route path="/practice" element={<PracticeView />} />
        <Route path="/mock" element={<MockTestView />} />
        <Route path="/mock/result" element={<MockResultView />} />
        <Route path="/review" element={<ReviewView />} />
        <Route path="/bookmarks" element={<BookmarksView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
