terraform {
    backend "s3" {
        bucket = "me-yoshiwalsh-tfstate"
        key = "lyrtube"
        region = "us-east-1"
    }
}