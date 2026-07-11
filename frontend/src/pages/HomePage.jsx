import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedConversation } = useChatStore();

  return (
    <div className="h-screen pt-16 bg-surface relative overflow-hidden ambient-glow">
      <div className="h-[calc(100vh-4rem)] min-h-0 flex relative z-[1]">
        <Sidebar />
        {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
};
export default HomePage;
