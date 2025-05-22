import React from "react";
import { useRouter } from "next/router";

const index = () => {
  const router = useRouter();
  return (
    <div className="bg-[#041200] font-display w-screen h-screen flex flex-col items-center justify-center gap-8">
      <div className="px-4 py-1 rounded-full backdrop-blur-md bg-white/10 text-white text-sm border border-white/20 shadow-sm">
        More Features Coming Soon ✨
      </div>
      <img
        className=" animate-pulse size-68 fixed top-2/4 left-1/8"
        src="/bg-grid.svg"
      ></img>
      <img
        className=" animate-pulse size-68 fixed top-1/4 left-6/8"
        src="/bg-grid.svg"
      ></img>

      <h1 className="text-white text-8xl font-semibold text-shadow-green-300 text-shadow-xs  ">
        Chat with <span className="text-green-700">Anyone!</span>{" "}
      </h1>
      <p className="text-white text-xl font-light">
        Connect Multiple People, and chat with a sleek chat app with functional
        and intuitive UI.
      </p>
      <button
        className="px-6 py-2 bg-green-700 text-white font-display tracking-wide text-xl rounded-xl cursor-pointer hover:bg-green-800 hover:text-green-100 hover:scale-105 transition-all duration-200"
        onClick={() => router.push("/signup")}
      >
        Sign Up
      </button>
    </div>
  );
};

export default index;
