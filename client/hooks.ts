import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "./types/redux";

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector.withTypes<RootState>();
