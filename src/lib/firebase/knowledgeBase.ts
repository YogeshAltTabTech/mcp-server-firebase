/**
 * Knowledge base for Firebase collections and schema information
 */
import * as fs from "fs";
import * as path from "path";

/**
 * Get knowledge about Firebase collections, schemas, and usage patterns
 * @param topic Optional specific topic to retrieve information about (not used in this simple implementation)
 * @returns Knowledge about Firebase database
 */
export async function getFirebaseKnowledge(topic?: string) {
  try {
    // Simply read the firebase-guide.md file
    const guidePath = path.join(
      __dirname,
      "../../documentation/firebase-guide.md"
    );

    if (fs.existsSync(guidePath)) {
      const guideContent = fs.readFileSync(guidePath, "utf8");
      return {
        content: [{ type: "text", text: guideContent }],
      };
    } else {
      console.error("Firebase guide file not found at:", guidePath);
      return {
        content: [
          {
            type: "text",
            text: "Firebase documentation file not found. Please make sure the firebase-guide.md file exists in the documentation directory.",
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    console.error("Error reading firebase guide file:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error loading documentation: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
