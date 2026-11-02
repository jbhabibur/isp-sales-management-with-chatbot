from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    visitor_id: str = Field(..., min_length=1, max_length=100)


class ChatMessageCreate(BaseModel):
    visitor_id: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1)


class ChatHandoffRequest(BaseModel):
    visitor_id: str = Field(..., min_length=1, max_length=100)


class ChatCustomerInfo(BaseModel):
    customer_name: str | None = None
    phone: str | None = None
    city: str | None = None
    area: str | None = None
    address: str | None = None


class AgentMessageCreate(BaseModel):
    session_id: int
    message: str = Field(..., min_length=1)


class ChatTransferRequest(BaseModel):
    session_id: int
    new_agent_id: int