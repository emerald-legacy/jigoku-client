import { useDispatch, useSelector } from "react-redux";

/**
 * Typed useDispatch hook - use throughout the app instead of plain useDispatch
 */
export const useAppDispatch = () => useDispatch();

/**
 * Typed useSelector hook - use throughout the app instead of plain useSelector
 */
export const useAppSelector = useSelector;
