"use client";

import { useMemo } from "react";
import {  type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import parse from "html-react-parser";
import { generateHTML } from "@tiptap/html";


export function RenderDescription({json}: {json: JSONContent}) {
   const output = useMemo(() => {
      try {
         // Validate that json is a proper JSONContent object
         if (!json || typeof json !== 'object') {
            console.error('Invalid JSON content passed to RenderDescription:', json);
            return '<p>Invalid content format</p>';
         }

         // Check if it has the required structure
         if (!json.type && !json.content) {
            console.error('JSON content missing type or content property:', json);
            return '<p>Invalid content structure</p>';
         }

         const html = generateHTML(json, [
            StarterKit.configure({
               // Configure StarterKit to exclude default list extensions
               bulletList: false,
               orderedList: false,
               listItem: false,
            }),
            // Explicitly add list extensions with proper configuration
            ListItem,
            BulletList.configure({
               HTMLAttributes: {
                  class: 'prose-bullet-list',
               },
            }),
            OrderedList.configure({
               HTMLAttributes: {
                  class: 'prose-ordered-list',
               },
            }),
            TextAlign.configure({ types: ["heading", "paragraph", "listItem"] }),
         ]);
         return html;
      } catch (error) {
         console.error('Error generating HTML from TipTap JSON:', error, json);
         return '<p>Error rendering content</p>';
      }
   }, [json])

   return (
      <div className="prose dark:prose-invert prose-li:marker:text-primary max-w-none">
         <div className="tiptap-content">
            {parse(output)}
         </div>
      </div>
   )
}