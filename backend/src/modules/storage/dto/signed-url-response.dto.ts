import { ApiProperty } from "@nestjs/swagger";

export class SignedUrlResponseDto {
  @ApiProperty({
    description: "The URL to upload the file to",
    example:
      "https://storage.googleapis.com/bucket-name/path/to/file?token=abc",
  })
  url: string;

  @ApiProperty({
    description: "The ID of the file that will be uploaded",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  fileId: string;

  @ApiProperty({
    description: "Additional fields to include in the upload form",
    example: {
      "Content-Type": "image/jpeg",
      "x-goog-meta-organization-id": "123",
    },
  })
  fields: Record<string, string>;
}
