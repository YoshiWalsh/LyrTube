provider "aws" {
    region = "us-east-2"
}

provider "aws" {
    alias = "certificates"
    region = "us-east-1"
}

locals {
    domain = "lyrtube.yoshiwalsh.me"
    old_domain = "lyrtube.joshwalsh.me"
    zones = ["yoshiwalsh.me.", "joshwalsh.me."]
}

module "lyrtube" {
    source = "github.com/YoshiWalsh/terraform-aws-gatsby//modules/simple-static-site?depth=1&ref=v1.0.1"

    providers = {
        aws = aws
        aws.certificates = aws.certificates
    }

    domain = local.domain
    domain_route53_zones = local.zones

    redirect_sources = [
        local.old_domain
    ]
}