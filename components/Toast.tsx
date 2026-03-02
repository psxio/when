"use client";

export default function Toast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return <div className={`toast ${visible ? "show" : ""}`}>{message}</div>;
}
