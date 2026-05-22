"use client"

import { useMemo, useState } from "react"
import type { Cattle } from "@/types"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TreeNode {
  cattle: Cattle | null
  tagNumber: string
  sire: TreeNode | null
  dam: TreeNode | null
  depth: number
}

function buildTree(
  tagNumber: string,
  allCattle: Cattle[],
  depth: number,
  maxDepth: number
): TreeNode {
  const cattle = allCattle.find((c) => c.tagNumber === tagNumber) || null
  return {
    cattle,
    tagNumber,
    sire:
      cattle?.sireTagNumber && depth < maxDepth
        ? buildTree(cattle.sireTagNumber, allCattle, depth + 1, maxDepth)
        : null,
    dam:
      cattle?.damTagNumber && depth < maxDepth
        ? buildTree(cattle.damTagNumber, allCattle, depth + 1, maxDepth)
        : null,
    depth,
  }
}

function AncestorNode({ node, isRoot }: { node: TreeNode; isRoot?: boolean }) {
  const { cattle, tagNumber } = node

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Parents row */}
      {(node.sire || node.dam) && (
        <div className="flex gap-4 items-end">
          {node.sire && (
            <div className="flex flex-col items-center gap-1">
              <AncestorNode node={node.sire} />
            </div>
          )}
          {node.dam && (
            <div className="flex flex-col items-center gap-1">
              <AncestorNode node={node.dam} />
            </div>
          )}
        </div>
      )}
      {/* Connector */}
      {(node.sire || node.dam) && (
        <div className="h-5 w-px bg-border" />
      )}
      {/* Node card */}
      <Link
        href={cattle ? `/cattle/${cattle.tagNumber}` : "#"}
        className={cn(
          "rounded-lg border px-3 py-2 text-center text-sm transition-colors hover:bg-accent w-32",
          isRoot
            ? "border-primary bg-primary/10 font-semibold"
            : cattle
            ? "bg-card hover:border-primary"
            : "bg-muted/30 border-dashed text-muted-foreground cursor-default"
        )}
        onClick={(e) => !cattle && e.preventDefault()}
      >
        <p className="font-mono font-semibold text-xs">{tagNumber}</p>
        {cattle?.nickname && (
          <p className="text-xs text-muted-foreground truncate">{cattle.nickname}</p>
        )}
        {cattle?.dateOfBirth && (
          <p className="text-xs text-muted-foreground">{formatDate(cattle.dateOfBirth)}</p>
        )}
        {cattle?.sex && (
          <p className="text-xs mt-0.5">
            <span className={cn(
              "rounded px-1 py-0.5 text-xs",
              cattle.sex === "male" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
            )}>
              {cattle.sex === "male" ? "♂ Bull" : "♀ Cow"}
            </span>
          </p>
        )}
        {!cattle && <p className="text-xs italic">Unknown</p>}
      </Link>
    </div>
  )
}

interface FamilyTreeProps {
  cattle: Cattle
  allCattle: Cattle[]
}

export function FamilyTree({ cattle, allCattle }: FamilyTreeProps) {
  const [expanded, setExpanded] = useState(false)
  const maxDepth = expanded ? 8 : 3

  const tree = useMemo(
    () => buildTree(cattle.tagNumber, allCattle, 0, maxDepth),
    [cattle.tagNumber, allCattle, maxDepth]
  )

  // Always build a depth-3 tree for print output regardless of expanded state
  const printTree = useMemo(
    () => buildTree(cattle.tagNumber, allCattle, 0, 3),
    [cattle.tagNumber, allCattle]
  )

  // Check if there are more ancestors beyond the initial view
  const canExpand = useMemo(() => {
    function hasDeeper(tagNumber: string, depth: number): boolean {
      if (depth === 0) return false
      const c = allCattle.find((x) => x.tagNumber === tagNumber)
      if (!c) return false
      if (depth === 1) return !!(c.sireTagNumber || c.damTagNumber)
      return (
        (!!c.sireTagNumber && hasDeeper(c.sireTagNumber, depth - 1)) ||
        (!!c.damTagNumber && hasDeeper(c.damTagNumber, depth - 1))
      )
    }
    return hasDeeper(cattle.tagNumber, 4) // any ancestor beyond depth 3?
  }, [cattle.tagNumber, allCattle])

  const hasAncestors = tree.sire || tree.dam

  if (!hasAncestors) {
    return (
      <div className="flex flex-col items-center py-8 text-muted-foreground">
        <p className="text-sm">No ancestry records available.</p>
        <p className="text-xs mt-1">Add sire/dam tag numbers to see the family tree.</p>
      </div>
    )
  }

  const legend = (
    <div className="mt-4 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded border border-primary bg-primary/10" />
        Subject
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
        Male (♂)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-pink-100 dark:bg-pink-900" />
        Female (♀)
      </span>
    </div>
  )

  return (
    <>
      {/* Screen: interactive expand/collapse */}
      <div className="print:hidden overflow-x-auto py-4">
        <div className="flex justify-center min-w-max px-4">
          <AncestorNode node={tree} isRoot />
        </div>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded border border-primary bg-primary/10" />
            Subject
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
            Male (♂)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-pink-100 dark:bg-pink-900" />
            Female (♀)
          </span>
          {(canExpand || expanded) && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <><ChevronUp className="mr-1 h-3 w-3" /> Collapse</>
              ) : (
                <><ChevronDown className="mr-1 h-3 w-3" /> Expand full tree</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Print: always depth 3 */}
      <div className="hidden print:block overflow-x-auto py-4">
        <div className="flex justify-center min-w-max px-4">
          <AncestorNode node={printTree} isRoot />
        </div>
        {legend}
      </div>
    </>
  )
}
