import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { RootState } from "./types/redux";

export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
