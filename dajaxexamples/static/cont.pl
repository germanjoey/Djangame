my $string = '';
{
  local $/ = undef;
  open FILE, "uisand3.html" or die "Couldn't open file: $!";
  $string = <FILE>;
  close FILE;
}

$string =~ s/_([A-Z])/$1/g;

open(OUT, ">", "uisand3.html") or die $!;
print OUT $string;
close OUT;