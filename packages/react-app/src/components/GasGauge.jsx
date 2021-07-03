import React from "react";
import { Button } from "antd";

export default function GasGauge(props) {
  return (
    <Button
      onClick={() => {
        window.open("https://ethgasstation.info/");
      }}
      size="small"
      shape="round"
      style={{
        border: "none",
      }}
    >
      <span style={{ marginRight: 8 }}><span role="img" aria-label="fuelpump">⛽️</span></span>
      {parseInt(props.gasPrice, 10) / 10 ** 9}g
    </Button>
  );
}
