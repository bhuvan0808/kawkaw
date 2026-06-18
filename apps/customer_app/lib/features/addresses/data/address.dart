class Address {
  const Address({
    required this.id,
    required this.line1,
    required this.pincode,
    required this.latitude,
    required this.longitude,
    this.type = 'HOME',
    this.label,
    this.line2,
    this.landmark,
    this.city = 'Bhadrachalam',
    this.state = 'Telangana',
    this.isDefault = false,
    this.receiverName,
    this.receiverPhone,
  });

  final String id;
  final String type;
  final String? label;
  final String line1;
  final String? line2;
  final String? landmark;
  final String city;
  final String state;
  final String pincode;
  final double latitude;
  final double longitude;
  final bool isDefault;
  final String? receiverName;
  final String? receiverPhone;

  String get summary => [line1, if (landmark != null) landmark, city, pincode]
      .whereType<String>()
      .join(', ');

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'] as String,
      type: (json['type'] as String?) ?? 'HOME',
      label: json['label'] as String?,
      line1: json['line1'] as String,
      line2: json['line2'] as String?,
      landmark: json['landmark'] as String?,
      city: (json['city'] as String?) ?? 'Bhadrachalam',
      state: (json['state'] as String?) ?? 'Telangana',
      pincode: json['pincode'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      isDefault: json['isDefault'] as bool? ?? false,
      receiverName: json['receiverName'] as String?,
      receiverPhone: json['receiverPhone'] as String?,
    );
  }
}

/// Payload for create/update (mirrors backend CreateAddressDto).
class AddressInput {
  const AddressInput({
    required this.line1,
    required this.pincode,
    required this.latitude,
    required this.longitude,
    this.type = 'HOME',
    this.label,
    this.line2,
    this.landmark,
    this.city = 'Bhadrachalam',
    this.state = 'Telangana',
    this.isDefault = false,
    this.receiverName,
    this.receiverPhone,
  });

  final String type;
  final String? label;
  final String line1;
  final String? line2;
  final String? landmark;
  final String city;
  final String state;
  final String pincode;
  final double latitude;
  final double longitude;
  final bool isDefault;
  final String? receiverName;
  final String? receiverPhone;

  Map<String, dynamic> toJson() => {
        'type': type,
        if (label != null && label!.isNotEmpty) 'label': label,
        'line1': line1,
        if (line2 != null && line2!.isNotEmpty) 'line2': line2,
        if (landmark != null && landmark!.isNotEmpty) 'landmark': landmark,
        'city': city,
        'state': state,
        'pincode': pincode,
        'latitude': latitude,
        'longitude': longitude,
        'isDefault': isDefault,
        if (receiverName != null && receiverName!.isNotEmpty) 'receiverName': receiverName,
        if (receiverPhone != null && receiverPhone!.isNotEmpty) 'receiverPhone': receiverPhone,
      };
}
