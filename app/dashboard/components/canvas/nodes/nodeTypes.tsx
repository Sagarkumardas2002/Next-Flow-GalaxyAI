"use client";

import TextNode from "./TextNode";
import ImageNode from "./ImageNode";
import VideoNode from "./VideoNode";
import CropNode from "./CropNode";
import ExtractNode from "./ExtractNode";
import LLMNode from "./LLMNode";

export const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  cropNode: CropNode,
  extractNode: ExtractNode,
  llmNode: LLMNode,
};
