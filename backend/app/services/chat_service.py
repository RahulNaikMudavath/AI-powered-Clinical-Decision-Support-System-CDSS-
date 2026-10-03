from typing import List, Tuple, Any
from app.services.llm_service import LLMService
from app.utils.llm_prompts import PROMPT_FOR_CHAT

class SimpleMessage:
    def __init__(self, type: str, content: str):
        self.type = type
        self.content = content

class ChatService:
    def __init__(self):
        self.llm_service = LLMService(max_tokens=1024)
    
    def generate_response(self, messages: List[Tuple[str, str]]) -> dict:
        processed_messages = []
        for item in messages:
            # Handle both tuples and dicts/objects
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                role, content = item[0], item[1]
            elif isinstance(item, dict):
                role, content = item.get("role", "user"), item.get("content", "")
            else:
                role, content = "user", str(item)

            if role == "system":
                processed_messages.append(SimpleMessage("system", f"{PROMPT_FOR_CHAT}\n\n{content}"))
            elif role == "user":
                processed_messages.append(SimpleMessage("user", content))
            elif role == "assistant":
                processed_messages.append(SimpleMessage("assistant", content))

        final_messages = []
        if len(processed_messages) >= 9:
            final_messages.append(processed_messages[0])
            for msg in processed_messages[-6:]:
                final_messages.append(msg)
        else:
            final_messages = processed_messages

        ai_message = self.llm_service.invoke_messages(final_messages)

        return {
            "assistant_message": ai_message
        }