import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedConversation } = useChatStore();

  return (
    <div className="h-screen pt-16 bg-surface relative overflow-hidden ambient-glow">
      <div className="h-[calc(100vh-4rem)] min-h-0 flex relative z-[1]">
        {/* Mobile: show either the list or the open chat, never both.
            Desktop (lg+): both panes are always visible side by side. */}
        <div className={`${selectedConversation ? "hidden" : "flex"} lg:flex w-full lg:w-auto`}>
          <Sidebar />
        </div>
        <div className={`${selectedConversation ? "flex" : "hidden"} lg:flex flex-1 min-w-0`}>
          {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};
export default HomePage;
