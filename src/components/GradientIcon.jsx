import React from "react";
import logo from "../assets/brand/logo.jpg";

// Logotip — TezPrava rasmiy brend belgisi. Ilova ochilganda (LoginScreen'da,
// ham orqa fondagi silent-login kutish holatida, ham ro'yxatdan o'tish
// formasi tepasida) shu logotip ko'rsatiladi.
export default function GradientIcon({ size = 96 }) {
  return (
    <img
      src={logo}
      alt="TezPrava"
      width={size}
      height={size}
      className="rounded-[22px] shadow-lg shadow-purple-900/30 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
