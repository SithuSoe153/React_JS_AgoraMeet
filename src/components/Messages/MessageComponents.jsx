const MessageList = ({ messages }) => {
  return (
    <div id="chat_messages">
      {messages.map((msg, index) => (
        <div key={index} className="message__wrapper">
          <div className="message__body">
            <strong className="message__author">{msg.senderId}</strong>
            <p className="message__text">{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


const MessageInput = ({ messageText, setMessageText, sendMessage }) => {
  return (
    <form id="message__form" onSubmit={sendMessage}>
      <input
        type="text"
        name="message"
        placeholder="Send a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
    </form>
  );
};


const BotMessage = ({ botMessage }) => {
  return (
    <div className="message__wrapper">
      <div className="message__body__bot">
        <strong className="message__author__bot">🤖 Meet.MyDay BotBot</strong>
        <p className="message__text__bot">{botMessage}</p>
      </div>
    </div>
  );
};



export { MessageList, MessageInput, BotMessage }