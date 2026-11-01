import { type Editor } from "@tiptap/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading1, Heading2, Heading3, Italic, ListIcon, ListOrderedIcon, Redo, Strikethrough, Undo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface iAppProps {
    editor: Editor | null;
}

export function Menubar({ editor }: iAppProps) {

    if(!editor) {
        return null;
    }
    return (
        <div className="border border-t-0 border-r-0 border-l-0 border-b-input rounded-t-lg p-2 flex flex-wrap gap-1 items-center bg-muted-foreground/10 dark:bg-muted/20 overflow-x-auto">
            <TooltipProvider>
                <div className="flex flex-wrap gap-1 min-w-fit">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("bold")} 
                            onPressedChange={() => editor.chain().focus().toggleBold().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-green-200/20 text-green-400")}>
                                <Bold className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Bold
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("italic")} 
                            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-green-200/20 text-green-400")}>
                                <Italic className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Italic
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("strike")} 
                            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-green-200/20 text-green-400")}>
                                <Strikethrough className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Strike
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("heading", { level: 1 })} 
                            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-green-200/20 text-green-400")}>
                                <Heading1 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Heading 1
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("heading", { level: 2 })} 
                            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-green-200/20 text-green-400")}>
                                <Heading2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Heading 2
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("heading", { level: 3 })} 
                            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-green-200/20 text-green-400")}>
                                <Heading3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Heading 3
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("bulletList")} 
                            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-green-200/20 text-green-400")}>
                                <ListIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Bullet List
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive("orderedList")} 
                            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-green-200/20 text-green-400")}>
                                <ListOrderedIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Ordered List
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex flex-wrap mx-2">
                    <div className="w-px bg-border h-8 mx-2 hidden sm:block"></div>
                    <div className="flex flex-wrap gap-1">
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive({textAlign: 'left'})} 
                            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                            className={cn("h-8 w-8 p-0", editor.isActive({textAlign: 'left'}) && "bg-green-200/20 text-green-400")}>
                                <AlignLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Align Left
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive({textAlign: 'center'})} 
                            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                            className={cn("h-8 w-8 p-0", editor.isActive({textAlign: 'center'}) && "bg-green-200/20 text-green-400")}>
                                <AlignCenter className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Align Center
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle 
                            size="sm" 
                            pressed={editor.isActive({textAlign: 'right'})} 
                            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                            className={cn("h-8 w-8 p-0", editor.isActive({textAlign: 'right'}) && "bg-green-200/20 text-green-400")}>
                                <AlignRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            Align Right
                        </TooltipContent>
                    </Tooltip>
                    </div>
                    <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>
                    <div className="flex flex-wrap gap-1">
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                type="button" 
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                                className="h-8 w-8 p-0"
                                >
                                <Undo className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Undo
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                type="button" 
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                                className="h-8 w-8 p-0"
                                >
                                <Redo className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Redo
                        </TooltipContent>
                    </Tooltip>
                    </div>
                </div>
            </TooltipProvider>
        </div>
    )
}