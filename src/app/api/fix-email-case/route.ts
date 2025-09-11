import { NextRequest, NextResponse } from "next/server";
import { fixEmailCase } from "@/lib/fix-email-case";

export async function POST(request: NextRequest) {
  try {
    const result = await fixEmailCase();
    
    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      errors: result.errors,
      message: result.success 
        ? `Successfully updated ${result.updated} email addresses to lowercase`
        : "Failed to fix email case"
    });
  } catch (error) {
    console.error("Error in fix-email-case API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: "Failed to process email case fix"
      },
      { status: 500 }
    );
  }
}
