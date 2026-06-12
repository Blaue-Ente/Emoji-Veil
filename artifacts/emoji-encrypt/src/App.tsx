import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EmojiEncrypt from "@/pages/EmojiEncrypt";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmojiEncrypt />
    </QueryClientProvider>
  );
}
