import React from "react";
import { GrAttachment } from "react-icons/gr";
import { BsEmojiSmile } from "react-icons/bs";
import { LuClock4 } from "react-icons/lu";
import { PiClockClockwiseFill } from "react-icons/pi";
import { IoDocumentTextSharp } from "react-icons/io5";
import { FaMicrophone } from "react-icons/fa";

const ChatBar = () => {
  return (
    <div className="flex text-lg gap-4 items-center justify-start ">
      <GrAttachment />
      <BsEmojiSmile />
      <LuClock4 />
      <PiClockClockwiseFill />
      <IoDocumentTextSharp />
      <FaMicrophone />
    </div>
  );
};

export default ChatBar;
