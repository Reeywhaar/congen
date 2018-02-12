<?php
class Gen implements IteratorAggregate, JsonSerializable
{
  private $it;
  public function __construct($it)
  {
    if (is_array($it)) {
      $this->it = new ArrayIterator($it);
      return;
    }
    $this->it = $it;
  }

  public function getIterator()
  {
    return $this->it;
  }

  public function map(callable $fn)
  {
    $it = function ($it) use ($fn) {
      foreach ($it as $item) {
        yield $fn($item);
      }
    };

    return new self($it($this->it));
  }

  public function filter(callable $fn)
  {
    $it = function ($it) use ($fn) {
      foreach ($it as $item) {
        if ($fn($item)) {
          yield $item;
        }
      }
    };

    return new self($it($this->it));
  }

  public function toArray(): array
  {
    return iterator_to_array($this->it);
  }

  public function jsonSerialize()
  {
    return $this->toArray();
  }
}
