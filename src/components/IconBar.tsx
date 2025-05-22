import React from "react";
import { AiFillHome } from "react-icons/ai";
import { FaChartLine, FaCodeFork } from "react-icons/fa6";
import {
  IoChatbubbleEllipsesSharp,
  IoTicketSharp,
  IoLogOutSharp,
} from "react-icons/io5";
import { TfiMenuAlt } from "react-icons/tfi";
import { HiSpeakerphone } from "react-icons/hi";
import { RiContactsBookLine, RiFolderImageFill } from "react-icons/ri";
import { MdChecklist } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";
import { TbStarsFilled } from "react-icons/tb";

const IconBar = () => {
  return (
    <div className="w-1/8 text-xl flex flex-col text-gray-600 border-r-1 border-gray-300 p-1 justify-between items-center">
      <div className="flex gap-8 flex-col">
        <AiFillHome className="border-b-1 border-gray-400 text-2xl pb-2" />
        <IoChatbubbleEllipsesSharp className="fill-green-500" />
        <IoTicketSharp />
        <FaChartLine className="border-b-1 border-gray-400 text-2xl pb-2" />
        <TfiMenuAlt />
        <HiSpeakerphone />
        <FaCodeFork className="rotate-180" />
        <RiContactsBookLine />
        <RiFolderImageFill className="border-b-1 border-gray-400 text-2xl pb-2" />
        <MdChecklist />
        <IoIosSettings />
      </div>
      <div className="flex gap-8 flex-col">
        <TbStarsFilled />
        <IoLogOutSharp />
      </div>
    </div>
  );
};

export default IconBar;
